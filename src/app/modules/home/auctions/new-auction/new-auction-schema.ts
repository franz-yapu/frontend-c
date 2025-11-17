export const auctionFormFields = (catalogs: any) => {
  return [
    {
      type: 'column',
      columns: [
        {
          fields: [
            {
              key: 'title',
              label: 'Nombre de la Subasta',
              type: 'text',
              validators: { required: true, maxLength: 50, minLength: 0 },
            },
            {
              key: 'description',
              label: 'Descripción',
              type: 'text',
            },
            // Fecha y hora de inicio
            {
              type: 'subtitle',
              text: 'Fecha y Hora de Inicio'
            },
            {
              key: 'startDate',
              label: 'Fecha de Inicio',
              type: 'date',
              validators: { required: true },
            },
            {
              key: 'startTime',
              label: 'Hora de Inicio',
              type: 'time',
              validators: { required: true },
            },
            // Fecha y hora de finalización
            {
              type: 'subtitle',
              text: 'Fecha y Hora de Finalización'
            },
            {
              key: 'endDate',
              label: 'Fecha de Finalización',
              type: 'date',
              validators: { required: true },
            },
            {
              key: 'endTime',
              label: 'Hora de Finalización',
              type: 'time',
              validators: { required: true },
            },
            {
              key: 'minIncrement',
              label: 'Incremento Mínimo',
              type: 'number',
              validators: {
                required: true,
                min: 0,
                decimalPlaces: 2
              }
            },
          ]
        },
      ]
    },
  ]
}