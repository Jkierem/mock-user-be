import * as hx from "../support/html.ts"
import Endpoint from "./components/endpoint.ts"
import Module from "./components/module.ts"

const UserModule = () => Module({
    name: "Users",
    endpoints: [
        Endpoint({
            method: "GET",
            path: "/user/:id",
            description: "Get the information of a single user",
            params: {
                id: "user id"
            }
        }),
        Endpoint({
            method: "POST",
            path: "/users",
            description: "Create a user. Requires a json body with username, password, name and balance. Username must be unique. Balance must be a number"
        }),
        Endpoint({
            method: "POST",
            path: "/login",
            description: "Validate if an user can login. Requires a json body with username and password"
        })
    ]
})

const TxModule = () => Module({
    name: "Transactions",
    endpoints: [
        Endpoint({
            method: "POST",
            path: "/transactions",
            description: 'Create a new transaction. Requires a json body with "from" , "to" and "amount". The "amount" must be a number. The "from" and "to" must be valid usernames with enough balance to go forth with the transaction'
        }),
        Endpoint({
            method: "GET",
            path: "/transactions/:username",
            description: 'Get all transactions of a single user',
            params: {
                username: "User's username"
            }
        })
    ]
})

const Docs = () => hx.body()(
    UserModule(),
    TxModule(),
)

export default Docs