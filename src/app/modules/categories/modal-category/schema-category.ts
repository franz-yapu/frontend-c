

export const categoryFormFields=(catalogs: any)=> {
    
      return ([
        {

            type: 'title',
            text: 'Categoria',
            style: 'title',
        },
        {
          type: 'column',
          columns: [
            {
              fields: [
                
                {
                  key: 'name',
                  label: 'Nombre del categoria',
                  type: 'text',
                  validators: { required: true, maxLength: 50, minLength: 0 },
                },
                
                
              ]
            },
            
        
          ]
        },
       
      
      ]
    )
   }