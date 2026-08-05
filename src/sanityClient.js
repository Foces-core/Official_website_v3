import { createClient } from "@sanity/client";

export default createClient({
  projectId: 'n7hx0w67',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2023-05-03',
});
