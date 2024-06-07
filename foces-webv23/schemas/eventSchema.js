import {defineField, defineType} from 'sanity'

export const eventType = defineType({
  name: 'event',
  title: 'Event',
  type: 'document',
  fields: [
    defineField({
      name: 'Event_name',
      type: 'string',
    }),
    defineField({
        name: 'date',
        type: 'date',
      }),
      defineField({
        name: 'image1',
        type: 'image',
      }),
      defineField({
        name: 'image2',
        type: 'image',
      }),
      defineField({
        name: 'image3',
        type: 'image',
      }),
      defineField({
        name: 'content',
        type: 'array',
        of: [{type: 'block'}],
      }),
      defineField({
        name: 'tickets',
        type: 'url',
      }),
  ],
})