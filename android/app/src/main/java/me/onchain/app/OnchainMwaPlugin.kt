package me.onchain.app

import android.net.Uri
import android.util.Base64
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.solana.mobilewalletadapter.clientlib.ActivityResultSender
import com.solana.mobilewalletadapter.clientlib.ConnectionIdentity
import com.solana.mobilewalletadapter.clientlib.MobileWalletAdapter
import com.solana.mobilewalletadapter.clientlib.Solana
import com.solana.mobilewalletadapter.clientlib.TransactionParams
import com.solana.mobilewalletadapter.clientlib.TransactionResult
import com.solana.mobilewalletadapter.clientlib.protocol.MobileWalletAdapterClient.AuthorizationResult
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Bridges the Capacitor WebView to the Solana Mobile Wallet Adapter clientlib.
 * Works with Seed Vault on Seeker and any MWA-compatible wallet on regular
 * Android (Phantom, Solflare, Backpack, etc.).
 *
 * Binary fields cross the JS boundary as base64 strings. The TS wrapper in
 * src/lib/mwa.ts converts base64 ↔ bs58 / Uint8Array as needed.
 */
@CapacitorPlugin(name = "OnchainMwa")
class OnchainMwaPlugin : Plugin() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    // MainActivity creates the sender during onCreate (before STARTED). We just
    // borrow that already-registered instance — re-creating it here at call
    // time would explode because the activity is already RESUMED.
    private fun sender(): ActivityResultSender? =
        (activity as? MainActivity)?.mwaSender

    private fun adapter(call: PluginCall, authToken: String?): MobileWalletAdapter {
        val identity = ConnectionIdentity(
            identityUri = call.getString("identityUri")?.let { Uri.parse(it) } ?: Uri.EMPTY,
            iconUri = call.getString("iconRelativeUri")?.let { Uri.parse(it) } ?: Uri.EMPTY,
            identityName = call.getString("identityName") ?: "Onchain.me",
        )
        val a = MobileWalletAdapter(connectionIdentity = identity)
        a.blockchain = when (call.getString("cluster")) {
            "devnet" -> Solana.Devnet
            "testnet" -> Solana.Testnet
            else -> Solana.Mainnet
        }
        if (!authToken.isNullOrEmpty()) a.authToken = authToken
        return a
    }

    private fun b64Enc(bytes: ByteArray): String =
        Base64.encodeToString(bytes, Base64.NO_WRAP)

    private fun b64Dec(s: String): ByteArray =
        Base64.decode(s, Base64.NO_WRAP)

    private fun authToJs(r: AuthorizationResult): JSObject = JSObject().apply {
        put("authToken", r.authToken)
        put("accountPublicKey", b64Enc(r.publicKey))
        put("accountLabel", r.accountLabel)
        put("walletUriBase", r.walletUriBase?.toString())
    }

    private fun resolveTxResult(call: PluginCall, result: TransactionResult<JSObject>) {
        when (result) {
            is TransactionResult.Success -> call.resolve(result.payload)
            is TransactionResult.NoWalletFound -> call.reject("NO_WALLET")
            is TransactionResult.Failure -> call.reject(result.message)
        }
    }

    @PluginMethod
    fun authorize(call: PluginCall) {
        val s = sender() ?: return call.reject("Host activity unavailable")
        val a = adapter(call, authToken = null)
        scope.launch {
            try {
                val result = a.transact(s) { authResult -> authToJs(authResult) }
                resolveTxResult(call, result)
            } catch (t: Throwable) {
                call.reject(t.message ?: "MWA_EXCEPTION")
            }
        }
    }

    @PluginMethod
    fun reauthorize(call: PluginCall) {
        val token = call.getString("authToken") ?: return call.reject("authToken required")
        val s = sender() ?: return call.reject("Host activity unavailable")
        val a = adapter(call, authToken = token)
        scope.launch {
            try {
                val result = a.transact(s) { authResult -> authToJs(authResult) }
                resolveTxResult(call, result)
            } catch (t: Throwable) {
                call.reject(t.message ?: "MWA_EXCEPTION")
            }
        }
    }

    @PluginMethod
    fun signMessages(call: PluginCall) {
        val token = call.getString("authToken") ?: return call.reject("authToken required")
        val msgsArr: JSArray = call.getArray("messages") ?: return call.reject("messages required")
        val messages = Array(msgsArr.length()) { idx -> b64Dec(msgsArr.getString(idx)) }

        val s = sender() ?: return call.reject("Host activity unavailable")
        val a = adapter(call, authToken = token)

        scope.launch {
            try {
                val result = a.transact(s) { authResult ->
                    val signed = signMessagesDetached(messages, arrayOf(authResult.publicKey))
                    val sigs = JSArray()
                    for (m in signed.messages) {
                        sigs.put(b64Enc(m.signatures.first()))
                    }
                    JSObject().apply {
                        put("authToken", authResult.authToken)
                        put("signatures", sigs)
                    }
                }
                resolveTxResult(call, result)
            } catch (t: Throwable) {
                call.reject(t.message ?: "MWA_EXCEPTION")
            }
        }
    }

    @PluginMethod
    fun signTransactions(call: PluginCall) {
        val token = call.getString("authToken") ?: return call.reject("authToken required")
        val txsArr: JSArray = call.getArray("transactions") ?: return call.reject("transactions required")
        val txs = Array(txsArr.length()) { idx -> b64Dec(txsArr.getString(idx)) }

        val s = sender() ?: return call.reject("Host activity unavailable")
        val a = adapter(call, authToken = token)

        scope.launch {
            try {
                val result = a.transact(s) { authResult ->
                    val signed = signTransactions(txs)
                    val arr = JSArray()
                    for (b in signed.signedPayloads) arr.put(b64Enc(b))
                    JSObject().apply {
                        put("authToken", authResult.authToken)
                        put("signedTransactions", arr)
                    }
                }
                resolveTxResult(call, result)
            } catch (t: Throwable) {
                call.reject(t.message ?: "MWA_EXCEPTION")
            }
        }
    }

    @PluginMethod
    fun signAndSendTransactions(call: PluginCall) {
        val token = call.getString("authToken") ?: return call.reject("authToken required")
        val txsArr: JSArray = call.getArray("transactions") ?: return call.reject("transactions required")
        val txs = Array(txsArr.length()) { idx -> b64Dec(txsArr.getString(idx)) }
        val minSlot = if (call.hasOption("minContextSlot")) call.getInt("minContextSlot") else null

        val params = TransactionParams(
            minContextSlot = minSlot,
            commitment = null,
            skipPreflight = null,
            maxRetries = null,
            waitForCommitmentToSendNextTransaction = null,
        )

        val s = sender() ?: return call.reject("Host activity unavailable")
        val a = adapter(call, authToken = token)

        scope.launch {
            try {
                val result = a.transact(s) { authResult ->
                    val sent = signAndSendTransactions(txs, params)
                    val arr = JSArray()
                    for (sig in sent.signatures) arr.put(b64Enc(sig))
                    JSObject().apply {
                        put("authToken", authResult.authToken)
                        put("signatures", arr)
                    }
                }
                resolveTxResult(call, result)
            } catch (t: Throwable) {
                call.reject(t.message ?: "MWA_EXCEPTION")
            }
        }
    }

    @PluginMethod
    fun deauthorize(call: PluginCall) {
        val token = call.getString("authToken") ?: run { call.resolve(); return }
        val s = sender() ?: run { call.resolve(); return }
        val a = adapter(call, authToken = token)
        scope.launch {
            try {
                a.transact(s) {
                    deauthorize(token)
                    JSObject()
                }
            } catch (_: Throwable) {
                // best-effort — JS side drops its token regardless
            } finally {
                call.resolve()
            }
        }
    }
}
