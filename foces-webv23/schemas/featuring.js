import {defineField, defineType} from 'sanity'

export const featuringType = defineType({
  name: 'featuring',
  title: 'Featuring',
  type: 'document',
  fields: [
    
      defineField({
        name: 'image',
        type: 'image',
      }),
      
      defineField({
        name: 'tickets',
        type: 'url',
      }),
  ],
})