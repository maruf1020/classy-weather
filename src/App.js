import React from 'react';

class Counter extends React.Component {

  constructor(props) {
    super(props);

    this.state = { count: 5 };
    this.handleIncrement = this.handleIncrement.bind(this);
    this.handleDecrement = this.handleDecrement.bind(this);
  }

  handleIncrement = () => {
    this.setState((curr) => {
      return { count: curr.count + 1 }
    })
  }
  handleDecrement = () => {
    this.setState((curr) => {
      return { count: curr.count - 1 }
    })
  }

  render() {
    const { count } = this.state;
    const date = new Date("June 10 2021");
    date.setDate(date.getDate() + count);
    return (
      <div>
        <button onClick={this.handleDecrement}>-</button>
        <span>{count}</span>
        <button onClick={this.handleIncrement}>+</button>
      </div>
    )

  }
}

export default Counter;