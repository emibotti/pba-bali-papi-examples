import { MultiAddress, dot, nextLocal } from '@polkadot-api/descriptors';
import {
  Binary,
  createClient,
  getTypedCodecs,
  type PolkadotSigner,
  type SS58String,
} from 'polkadot-api';
import { connectInjectedExtension } from 'polkadot-api/pjs-signer';
import { getWsProvider } from 'polkadot-api/ws-provider/web';
import './App.css';

const client = createClient(
  getWsProvider('wss://polkadot-rpc.publicnode.coms')
);
const typedApi = client.getTypedApi(dot);
// const nextApi = client.getTypedApi(nextLocal);

const extension = await connectInjectedExtension('polkadot-js');
const signerAccount = extension
  .getAccounts()
  .find((v) => v.name === 'PBA Oliva')!;

// const multisigSigner = getMultisigSigner(
//   {
//     signatories: ["Josep", "Carlo", "Victor"],
//     threshold: 2,
//   },
//   typedApi.query.Multisig.Multisigs.getValue,
//   typedApi.apis.TransactionPaymentApi.query_info,
//   signerAccount.polkadotSigner
// );

const typedCodecs = await getTypedCodecs(dot);

const createProxySigner = (
  proxied: SS58String,
  signer: PolkadotSigner
): PolkadotSigner => ({
  publicKey: signer.publicKey,
  signBytes() {
    throw new Error("Can't sign bytes");
  },
  async signTx(callData, signedExtensions, metadata, atBlockNumber, hasher) {
    const txCallData = await typedApi.txFromCallData(
      Binary.fromBytes(callData)
    );

    // Alternative way:
    // const decodedCall = typedCodecs.tx.Proxy.proxy.inner.call.dec(callData)

    const encodedProxy = await typedCodecs.tx.Proxy.proxy.enc({
      real: MultiAddress.Id(proxied),
      call: txCallData.decodedCall,
      force_proxy_type: undefined,
    });

    return signer.signTx(
      encodedProxy,
      signedExtensions,
      metadata,
      atBlockNumber,
      hasher
    );
  },
});
