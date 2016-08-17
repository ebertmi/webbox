import { EventEmitter } from 'events';

export default class TestResult extends EventEmitter {
  constructor(data) {
    super();
    this.data = data;
    console.info(data);
  }

  getScore() {
    return this.data.score;
  }

  getMaximumScore() {
    return this.data.max_score;
  }

  getTests() {
    return this.data.tests;
  }

  getScorePercentage() {
    return  this.data.score / this.data.max_score * 100;
  }

  getData() {
    return this.data;
  }
}