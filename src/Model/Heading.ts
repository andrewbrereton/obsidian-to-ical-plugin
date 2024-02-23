export class Heading {
  private date: Date;
  private line: number;

  constructor(date: Date, line: number) {
    this.date = date;
    this.line = line;
  }

  public get getDate(): Date {
    return this.date;
  }

  public get getLine(): number {
    return this.line;
  }
}
