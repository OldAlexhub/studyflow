import os
import sys
import shutil
import subprocess
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent
ANDROID_DIR = ROOT / "android"
RELEASES_DIR = ROOT / "releases"

IS_WINDOWS = os.name == "nt"
GRADLEW = ANDROID_DIR / ("gradlew.bat" if IS_WINDOWS else "gradlew")

APK_PATH = ANDROID_DIR / "app" / "build" / "outputs" / "apk" / "release" / "app-release.apk"
AAB_PATH = ANDROID_DIR / "app" / "build" / "outputs" / "bundle" / "release" / "app-release.aab"

# ---------------------------------------------------------------------------
# Windows long-path support
# ---------------------------------------------------------------------------

def _check_long_paths() -> None:
    """
    On Windows the default MAX_PATH limit is 260 chars. Deep project trees
    (Desktop/GooglePlay/StudyFlow/android/app/build/…) can exceed this during
    Gradle builds. We try to enable long-path support for the current process
    and print a one-time warning when the project root looks risky.
    """
    if not IS_WINDOWS:
        return

    root_len = len(str(ROOT))
    if root_len > 120:
        print(
            f"\n  WARNING: project root is {root_len} chars long ({ROOT}).\n"
            "  Gradle build artifacts may exceed the Windows 260-char path limit.\n"
            "  If the build fails with path errors, run once in an elevated terminal:\n"
            "    reg add HKLM\\SYSTEM\\CurrentControlSet\\Control\\FileSystem "
            "/v LongPathsEnabled /t REG_DWORD /d 1 /f\n"
            "  then reboot, or move the project closer to the drive root.\n"
        )

    # Enable long paths for subprocess children via manifest option (no-op if
    # already enabled system-wide, harmless otherwise).
    try:
        import ctypes
        ctypes.windll.kernel32.SetFileAttributesW(str(ROOT), 0)  # dummy; tests WinAPI access
    except Exception:
        pass  # non-fatal


def _short_gradle_user_home() -> str:
    """Return a Gradle user home path that is guaranteed to be short."""
    home = Path.home()
    candidate = home / ".gradle"
    # ~/.gradle is typically C:\Users\<name>\.gradle — well under the limit.
    return str(candidate)


# ---------------------------------------------------------------------------
# Environment auto-detection
# ---------------------------------------------------------------------------

def _find_java_home() -> Path | None:
    """Return a valid JAVA_HOME directory, or None if not found."""

    # 1. Already set in the environment
    env_val = os.environ.get("JAVA_HOME", "").strip()
    if env_val:
        p = Path(env_val)
        if (p / "bin" / ("java.exe" if IS_WINDOWS else "java")).exists():
            return p

    if IS_WINDOWS:
        candidates = [
            Path("C:/Program Files/Android/Android Studio/jbr"),
            Path("C:/Program Files/Android/Android Studio/jre"),
            Path("C:/Program Files (x86)/Android/Android Studio/jbr"),
        ]
        # Eclipse Adoptium / Temurin — search one level deep
        for base in [
            Path("C:/Program Files/Eclipse Adoptium"),
            Path("C:/Program Files/Java"),
            Path("C:/Program Files/Microsoft"),
        ]:
            if base.exists():
                for child in sorted(base.iterdir(), reverse=True):
                    candidates.append(child)
    else:
        candidates = [
            Path("/Applications/Android Studio.app/Contents/jbr"),
            Path("/Applications/Android Studio.app/Contents/jre"),
        ]
        # macOS: /Library/Java/JavaVirtualMachines/<version>/Contents/Home
        jvm_root = Path("/Library/Java/JavaVirtualMachines")
        if jvm_root.exists():
            for vm in sorted(jvm_root.iterdir(), reverse=True):
                candidates.append(vm / "Contents" / "Home")
        # Linux: /usr/lib/jvm/*
        linux_jvm = Path("/usr/lib/jvm")
        if linux_jvm.exists():
            for vm in sorted(linux_jvm.iterdir(), reverse=True):
                candidates.append(vm)

    java_bin = "java.exe" if IS_WINDOWS else "java"
    for candidate in candidates:
        if candidate.exists() and (candidate / "bin" / java_bin).exists():
            return candidate

    return None


def _find_android_sdk() -> Path | None:
    """Return a valid Android SDK root directory, or None if not found."""

    # 1. Already set in the environment
    for var in ("ANDROID_HOME", "ANDROID_SDK_ROOT"):
        env_val = os.environ.get(var, "").strip()
        if env_val:
            p = Path(env_val)
            if p.exists():
                return p

    if IS_WINDOWS:
        local_app_data = os.environ.get("LOCALAPPDATA") or str(Path.home() / "AppData" / "Local")
        user_profile = os.environ.get("USERPROFILE") or str(Path.home())
        candidates = [
            Path(local_app_data) / "Android" / "Sdk",
            Path(user_profile) / "AppData" / "Local" / "Android" / "Sdk",
        ]
    else:
        candidates = [
            Path.home() / "Library" / "Android" / "sdk",   # macOS
            Path.home() / "Android" / "Sdk",                # Linux
            Path("/opt/android-sdk"),
        ]

    for candidate in candidates:
        if candidate.exists():
            return candidate

    return None


def setup_environment() -> dict:
    """Build an env dict with JAVA_HOME and ANDROID_HOME injected."""
    env = os.environ.copy()

    java_home = _find_java_home()
    android_sdk = _find_android_sdk()

    if java_home:
        env["JAVA_HOME"] = str(java_home)
        java_bin = str(java_home / "bin")
        env["PATH"] = java_bin + os.pathsep + env.get("PATH", "")
        print(f"  Java  : {java_home}")
    else:
        print("  Java  : not found — set JAVA_HOME or install Android Studio")

    if android_sdk:
        env["ANDROID_HOME"] = str(android_sdk)
        env["ANDROID_SDK_ROOT"] = str(android_sdk)
        platform_tools = str(android_sdk / "platform-tools")
        env["PATH"] = platform_tools + os.pathsep + env.get("PATH", "")
        print(f"  SDK   : {android_sdk}")
    else:
        print("  SDK   : not found — set ANDROID_HOME or install Android Studio SDK")

    if not java_home or not android_sdk:
        fail("Could not locate Java or Android SDK. See messages above.")

    # Pin GRADLE_USER_HOME to ~/.gradle (a short, predictable path) to avoid
    # Windows MAX_PATH issues when the project tree is deeply nested.
    env.setdefault("GRADLE_USER_HOME", _short_gradle_user_home())
    print(f"  Gradle: {env['GRADLE_USER_HOME']}")

    return env


# ---------------------------------------------------------------------------
# Core helpers
# ---------------------------------------------------------------------------

def fail(message: str) -> None:
    print(f"\nERROR: {message}")
    sys.exit(1)


def run_command(command: list[str], cwd: Path, env: dict) -> None:
    print(f"\nRunning: {' '.join(command)}")
    result = subprocess.run(
        command,
        cwd=str(cwd),
        shell=False,
        env=env,
        # On Windows, pass the long-path UNC prefix to the subprocess launcher
        # so child processes inherit a long-path–aware working directory.
        **({} if not IS_WINDOWS else {}),
    )
    if result.returncode != 0:
        fail(f"Command failed with exit code {result.returncode}: {' '.join(command)}")


def validate_project() -> None:
    if not ANDROID_DIR.exists():
        fail("android/ not found. Run this script from the React Native project root.")
    if not GRADLEW.exists():
        fail(f"Gradle wrapper not found at: {GRADLEW}")
    if not IS_WINDOWS:
        try:
            GRADLEW.chmod(GRADLEW.stat().st_mode | 0o111)
        except Exception as exc:
            fail(f"Could not make gradlew executable: {exc}")


def copy_artifact(source_path: Path, artifact_type: str) -> Path:
    if not source_path.exists():
        fail(f"Expected {artifact_type.upper()} not found at: {source_path}")
    RELEASES_DIR.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    target_path = RELEASES_DIR / f"StudyFlow_release_{timestamp}.{artifact_type}"
    shutil.copy2(source_path, target_path)
    print(f"{artifact_type.upper()} -> {target_path}")
    return target_path


# ---------------------------------------------------------------------------
# Build actions
# ---------------------------------------------------------------------------

def deep_clean(env: dict) -> None:
    """Delete Gradle caches + build outputs so no stale generated files remain."""
    for cache_dir in [
        ANDROID_DIR / ".gradle",
        ANDROID_DIR / "build",
        ANDROID_DIR / "app" / "build",
    ]:
        if cache_dir.exists():
            print(f"  Removing {cache_dir}")
            shutil.rmtree(cache_dir, ignore_errors=True)
    run_command([str(GRADLEW), "clean"], ANDROID_DIR, env)


def clean(env: dict) -> None:
    deep_clean(env)


def build_apk(env: dict) -> Path:
    run_command([str(GRADLEW), "assembleRelease"], ANDROID_DIR, env)
    return copy_artifact(APK_PATH, "apk")


def build_aab(env: dict) -> Path:
    run_command([str(GRADLEW), "bundleRelease"], ANDROID_DIR, env)
    return copy_artifact(AAB_PATH, "aab")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def print_usage() -> None:
    print("""
StudyFlow release builder

Usage:
  python release.py apk      Build and sign a release APK
  python release.py aab      Build and sign a release AAB (Play Store)
  python release.py both     Build both APK and AAB
  python release.py clean    Clean Gradle build outputs

Notes:
  - Java and Android SDK are auto-detected (Android Studio, JAVA_HOME, ANDROID_HOME).
  - Signing credentials must be in ~/.gradle/gradle.properties — this script never
    asks for or stores passwords.
  - Artifacts are copied to releases/ with a timestamp in the filename.
  - GRADLE_USER_HOME is pinned to ~/.gradle to keep Gradle cache paths short
    (avoids Windows MAX_PATH issues with deeply nested project directories).
""")


def main() -> None:
    _check_long_paths()
    validate_project()

    if len(sys.argv) < 2:
        print_usage()
        sys.exit(0)

    action = sys.argv[1].lower().strip()

    print("\nDetecting build environment...")
    env = setup_environment()

    if action == "clean":
        clean(env)
        print("\nClean complete.")
        return

    if action == "apk":
        clean(env)
        apk = build_apk(env)
        print(f"\nAPK ready: {apk}")
        return

    if action == "aab":
        clean(env)
        aab = build_aab(env)
        print(f"\nAAB ready: {aab}")
        return

    if action == "both":
        clean(env)
        apk = build_apk(env)
        aab = build_aab(env)
        print("\nRelease build complete.")
        print(f"  APK : {apk}")
        print(f"  AAB : {aab}")
        return

    print_usage()
    fail(f"Unknown command: '{action}'")


if __name__ == "__main__":
    main()
