import { defineField,defineType } from "sanity";

export const notificationType = defineType({
    name: 'notification',
    title: 'Notification',
    type: 'document',
    fields: [
      defineField({
        name: 'Event_name',
        type: 'string',
      }),
      defineField({
        name: 'id',
        type: 'number',
      }),
      defineField({
          name: 'date',
          type: 'date',
        }),
        
        defineField({
          name: 'short_details',
          type: 'array',
          of: [{type: 'block'}],
        }),
       
    ],
  })