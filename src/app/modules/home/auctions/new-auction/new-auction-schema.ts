

export const auctionFormFields=(catalogs: any)=> {
    
      return ([
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
                {
                  key: 'startDate',
                  label: 'Fecha de Inicio',
                  type: 'datetime',
                  validators: { required: true },
                },
                {
                  key: 'endDate',
                  label: 'Fecha de Finalización',
                  type: 'datetime',
                  validators: { required: true},
                },
                /* {
                  key: 'minIncrement',
                  label: 'Incremento Mínimo',
                  type: 'number',
                  validators: { 
                    required: true,
                    min: 0,
                   decimalPlaces: 2,
                   allowDecimals: true,
                  isNumber: true},

                }, */
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
    )
   }