const { request } = require('express');
const express = require('express');
const { process_params } = require('express/lib/router');
const { v4: UUidv4 } = require('uuid')

const app = express();

app.use(express.json());

// db
const customers = [];


// middlewares
function verifyIfExistAccountCPF(request, response, next) {
    const { cpf } = request.headers;

    const customer = customers.find((customer) => customer.cpf === cpf);

    if(!customer) {
        return response.status(400).json({ error: "Customer not found" });
    }

    request.customer = customer;

    return next();
}

// functinos
function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if(operation.type === 'credit') {
            return acc + operation.amount;
        }else {
            return acc - operation.amount;
        }
    }, 0);

    return balance;
}

// app.use(verifyIfExistAccountCPF);


// main
app.get('/', (req, res) => {
    return res.json('Welcome!!');
});

app.post("/account", (request, response) => {
    const { cpf, name } = request.body;

    const customersAlreadyExist = customers.some(
        (customers) => customers.cpf === cpf
    );

    if(customersAlreadyExist) {
        return response.status(400).json({erros: "Customer already exists!"});
    }

    customers.push({
        cpf,
        name,
        id: UUidv4(),
        statement: []
    })

    console.log(customers)

    return response.status(201).send();
});

app.get('/statement', verifyIfExistAccountCPF, (request, response) => {
    const { customer } = request;

    return response.status(200).json(customer.statement);
});

app.post('/deposit', verifyIfExistAccountCPF, (request, response) => {
    const { description, amount } = request.body;

    const { customer } = request;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: 'credit'
    }

    customer.statement.push(statementOperation);

    return response.status(201).send();
})

app.post('/withdraw', verifyIfExistAccountCPF, (request, response) => {
    const { amount } = request.body;
    const { customer } = request;

    const balance = getBalance(customer.statement);

    if(balance < amount) {
        return response.status(400).json({erros: "Insufficient funds"});
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit",
    }

    customer.statement.push(statementOperation);

    return response.status(201).send();
});

app.get("/statement/date", verifyIfExistAccountCPF, (request, response) => {
    const { customer } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString())

    return response.json(statement)
})

app.put("/account", verifyIfExistAccountCPF, (request, response) => {
    const { name } = request.body;
    const { customer } = request;

    customer.name = name;

    return response.status(201).send()
})

app.get("/account", verifyIfExistAccountCPF, (request, response) => {
    const { customer } = request;

    return response.json(customer);
})

app.delete("/account", verifyIfExistAccountCPF, (request, response) => {
    const { customer } = request;

    customers.splice(customer, 1);

    return response.status(200).json(customers);
})

app.get("/balance", verifyIfExistAccountCPF, (request, response) => {
    const { customer } = request;

    const balance = getBalance(customer.statement);

    return response.json(balance);
})

// listen
const port = 3030;
app.listen(port, () => {
    console.log(`running in https://localhost:${port}`);
});

/**
 * Account datas
 *  - CPF: string,
 *  - name: string,
 *  - id: uuid,
 *  - statement: []
 */
