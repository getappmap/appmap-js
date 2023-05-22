export class CountNumProcessed {
  public count = 0;

  public setCount(): (count: number) => void {
    return (count: number) => {
      this.count = count;
    };
  }
}
