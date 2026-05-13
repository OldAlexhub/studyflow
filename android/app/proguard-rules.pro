# React Native core
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-dontwarn com.facebook.react.**
-dontwarn com.facebook.hermes.**

# StudyFlow native modules
-keep class com.studyflow.** { *; }

# React Navigation
-keep class com.swmansion.** { *; }
-keep class com.th3rdwave.safeareacontext.** { *; }

# Kotlin
-keep class kotlin.** { *; }
-dontwarn kotlin.**

# Suppress warnings from unused bundled libs
-dontwarn org.slf4j.**
-dontwarn javax.**
