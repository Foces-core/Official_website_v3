// import {defineCliConfig} from 'sanity/cli'

// export default defineCliConfig({
//   api: {
//     projectId: 'n7hx0w67',
//     dataset: 'production'
//   }
// })


import client from "@sanity/client"

export default client({
  projectId: 'n7hx0w67',
     dataset: 'production',
     useCdn: true,

})