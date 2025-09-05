import { Observable } from 'rxjs';

const myObservable$ = new Observable<number>((subscriber) => {
  let number = 0;
  const token = setInterval(() => {
    number++;
    subscriber.next(number);

    if (number === 10) {
      subscriber.complete();
    }
  }, 200);

  subscriber.next(number);
  return () => {
    clearInterval(token);
  };
});

// When someone subscribe, you get push actions
const subscription = myObservable$.subscribe((res) => {
  console.log(res);
  if (res === 3) {
    subscription.unsubscribe();
  }
});
