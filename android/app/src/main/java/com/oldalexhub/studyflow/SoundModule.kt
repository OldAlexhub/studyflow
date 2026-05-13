package com.oldalexhub.studyflow

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import kotlin.math.PI
import kotlin.math.sin

class SoundModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "StudyFlowSound"

    @ReactMethod
    fun playChime() {
        Thread {
            playTone(880.0, 160)
            Thread.sleep(60)
            playTone(660.0, 320)
        }.start()
    }

    private fun playTone(frequency: Double, durationMs: Int) {
        val sampleRate = 44100
        val numSamples = sampleRate * durationMs / 1000
        val fadeIn = sampleRate * 20 / 1000
        val fadeOut = sampleRate * 60 / 1000

        val buffer = ShortArray(numSamples) { i ->
            val t = i.toDouble() / sampleRate
            val envelope = when {
                i < fadeIn -> i.toDouble() / fadeIn
                i > numSamples - fadeOut -> (numSamples - i).toDouble() / fadeOut
                else -> 1.0
            }
            (envelope * 0.55 * Short.MAX_VALUE * sin(2 * PI * frequency * t))
                .toInt().toShort()
        }

        val minBuf = AudioTrack.getMinBufferSize(
            sampleRate,
            AudioFormat.CHANNEL_OUT_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
        )
        val bufBytes = maxOf(buffer.size * 2, minBuf)

        val track = AudioTrack.Builder()
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            )
            .setAudioFormat(
                AudioFormat.Builder()
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .setSampleRate(sampleRate)
                    .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                    .build()
            )
            .setBufferSizeInBytes(bufBytes)
            .setTransferMode(AudioTrack.MODE_STATIC)
            .build()

        track.write(buffer, 0, buffer.size)
        track.play()
        Thread.sleep(durationMs.toLong() + 20)
        track.stop()
        track.release()
    }
}
