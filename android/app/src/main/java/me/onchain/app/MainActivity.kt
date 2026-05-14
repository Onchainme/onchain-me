package me.onchain.app

import android.os.Bundle
import com.getcapacitor.BridgeActivity
import com.solana.mobilewalletadapter.clientlib.ActivityResultSender

/**
 * `ActivityResultSender(this)` calls `registerForActivityResult(...)`, which
 * asserts the activity's lifecycle state is `< STARTED`. Capacitor instantiates
 * plugins lazily on the first JS call — by then we're already RESUMED and the
 * registration fails. So we build the sender here, before `super.onCreate`
 * transitions us through CREATED → STARTED, and expose it to the plugin.
 */
class MainActivity : BridgeActivity() {

    lateinit var mwaSender: ActivityResultSender
        private set

    override fun onCreate(savedInstanceState: Bundle?) {
        mwaSender = ActivityResultSender(this)
        registerPlugin(OnchainMwaPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
