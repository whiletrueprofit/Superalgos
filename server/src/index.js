import express from 'express'
import bodyParser from 'body-parser'
import 'dotenv/config'
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express'
import { makeRemoteExecutableSchema, mergeSchemas, introspectSchema } from 'graphql-tools'
import fetch from 'node-fetch'
import { createHttpLink } from 'apollo-link-http'

async function run () {
  const createRemoteSchema = async (uri) => {
    const makeDatabaseServiceLink = () => createHttpLink({
      uri: uri,
      fetch
    })
    const databaseServiceSchemaDefinition = await introspectSchema(makeDatabaseServiceLink())

    return makeRemoteExecutableSchema({
      schema: databaseServiceSchemaDefinition,
      link: makeDatabaseServiceLink()
    })
  }

  const teamsSchema = await createRemoteSchema(process.env.TEAMS_API_URL)
  // const usersSchema = await createRemoteSchema(process.env.USERS_API_URL)
  const keyvaultSchema = await createRemoteSchema(process.env.KEYVAULT_API_URL)

  // const linkSchemaDefs =
  // `
  //   extend type User {
  //     user: User
  //   }
  // `

  const schema = mergeSchemas({
    schemas: [teamsSchema, keyvaultSchema]
    // schemas: [teamsSchema, usersSchema, keyvaultSchema, linkSchemaDefs],
    // resolvers: mergeInfo => ({
    //   Team: {
    //     location: {
    //       fragment: `fragment TeamFragment on Team {owner}`,
    //       resolve (parent, args, context, info) {
    //         const authId = parent.owner
    //         return mergeInfo.delegate(
    //           'query',
    //           'userByAuthId',
    //           { authId },
    //           context,
    //           info
    //         )
    //       }
    //     }
    //   }
    // })
  })

  const app = express()

  app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }))

  app.use(
    '/graphiql',
    graphiqlExpress({
      endpointURL: '/graphql',
      query: `
      {
        teams{
          edges{
            node{
              name
            }
          }
        }
      }
      `
    })
  )

  app.listen(3000)
  console.log('Server running. Open http://localhost:3000/graphiql to run queries.')
}

try {
  run()
} catch (e) {
  console.log(e, e.message, e.stack)
}
