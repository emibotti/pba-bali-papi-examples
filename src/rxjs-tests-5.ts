import { createClient } from 'polkadot-api';
import { getWsProvider } from 'polkadot-api/ws-provider/web';
import { dot } from '@polkadot-api/descriptors';
import { switchMap } from 'rxjs';

const client = createClient(getWsProvider('wss://polkadot-rpc.publicnode.com'));
const typedApi = client.getTypedApi(dot);

const ACCOUNT = '1jbZxCFeNMRgVRfggkknf8sTWzrVKbzLvRuLWvSyg9bByRG';
const TRACK = 33;

const getVoteDirection = (vote: number) =>
  vote & 0x80 ? ('aye' as const) : ('nay' as const);

// Get the OnGoing referenda that I'm voting (ACCOUNT) in track 33 and I'm in the winning side (either 'Aye' or 'nay')
//  -- Remember '2' -> is 10b that means 'Aye', and '130' is '10000010b' that means 'Aye' with conviction 2.

// query.ConvictionVoting.VotingFor.watchValue(account, track)
// query.Referenda.ReferendumInfoFor.getValues([number][])

function isAye(vote: number) {
  // return vote.toString(2).startsWith('1', 0);
  return getVoteDirection(vote) === 'aye';
}

type ReferendumId = number;
type VoteDirection = 'aye' | 'nay';

const referendaWithSameOutcome$ =
  typedApi.query.ConvictionVoting.VotingFor.watchValue(ACCOUNT, TRACK).pipe(
    switchMap((item) => {
      const referendumIds: number[] = [];
      if ('votes' in item.value) {
        const votesInReferenda = item.value.votes.reduce(
          (acc, [referendumId, item]) => {
            if ('vote' in item.value) {
              acc.set(referendumId, isAye(item.value.vote) ? 'aye' : 'nay');
              referendumIds.push(referendumId);
            }
            return acc;
          },
          new Map<ReferendumId, VoteDirection>()
        );

        const winningReferenda =
          typedApi.query.Referenda.ReferendumInfoFor.getValues(
            referendumIds.map((id) => [id])
          ).then((referenda) =>
            referenda.filter((item, index) => {
              const referendumId = referendumIds[index];
              if (item?.type === 'Ongoing') {
                const winningSideIsAye =
                  item.value.tally.ayes > item.value.tally.nays;
                const votedAye = votesInReferenda.get(referendumId) === 'aye';

                return (
                  (votedAye && winningSideIsAye) ||
                  (!votedAye && !winningSideIsAye)
                );
              }
            })
          );

        return winningReferenda;
      }
      return [];
    })
  );

referendaWithSameOutcome$.subscribe((r) => console.log(r));
