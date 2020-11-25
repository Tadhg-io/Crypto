import React, { Component } from 'react';
import { FormGroup, FormControl, Button } from 'react-bootstrap';
import { Link, withRouter } from 'react-router-dom';
import history from '../history';

class ConductTransaction extends Component {
    state = { recipient: '', amount: 0 };

    // when the user enters a recipient, change the component state
    updateRecipient = event => {
        this.setState({ recipient: event.target.value });
    }

    // when the user enters an amount, update the component state
    updateAmount = event => {
        this.setState({ amount: Number(event.target.value) });
    }

    // execute the transaction
    conductTransaction = () => {
        const { recipient, amount } = this.state;

        fetch('http://localhost:3000/api/transact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipient, amount })
        }).then(response => response.json())
            .then(json => {
                alert(json.message || json.type);
                this.props.history.push('/transaction-pool');
            });
    }

    render () {
        return (
            <div className='ConductTransaction'>
                <Link to='/'>Home</Link>
                <h3>Conduct a Transaction</h3>
                <FormGroup>
                    <FormControl 
                        input='text'
                        placeholder='recipient'
                        value={this.state.recipient}
                        onChange={this.updateRecipient}
                    />
                </FormGroup>
                <FormGroup>
                    <FormControl 
                        input='number'
                        placeholder='amount'
                        value={this.state.amount}
                        onChange={this.updateAmount}
                    />
                </FormGroup>
                <div>
                    <Button 
                        variant="warning"
                        onClick={this.conductTransaction}
                    >
                        Submit
                    </Button>
                </div>
            </div>
        )
    }
};

export default ConductTransaction;