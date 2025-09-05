import { pas } from '@polkadot-api/descriptors';
import { createClient } from 'polkadot-api';
import { chainSpec } from 'polkadot-api/chains/paseo';
import { getSmProvider } from 'polkadot-api/sm-provider';
import { start } from 'polkadot-api/smoldot';
import { switchMap } from 'rxjs';

const smoldot = start();
const chain = smoldot.addChain({
  chainSpec,
});
const client = createClient(getSmProvider(chain));
const typedApi = client.getTypedApi(pas);

// let accSubscription$: string | null = null;
// const sudoSubscription$ = typedApi.query.Sudo.Key.watchValue().subscribe(
//   (key) => {
//     console.log('sudo key', key);
//     if (accSubscription$) {
//       accSubscription$.unsubscribe();
//     }
//     accSubscription$ = typedApi.query.System.Account.watchValue(key!).subscribe(
//       (account) => {
//         console.log('account', account);
//       }
//     );

//     return () => {
//       accSubscription$.unsubscribe();
//     };
//   }
// );

// typedApi.query.System.Account.watchValue('Sudo key').subscribe((r) => {});

const result = typedApi.query.Sudo.Key.watchValue().pipe(
  switchMap((key) => typedApi.query.System.Account.watchValue(key!))
);

result.subscribe((r) => {
  console.log('account', r);
});
