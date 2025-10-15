

export const userFormFields = (catalogs: any) => {

    return ([

        {
            type: 'column',
            columns: [
                {
                    fields: [

                        {
                            key: 'firstName',
                            label: 'Nombre ',
                            type: 'text',
                            validators: { required: true, maxLength: 50, minLength: 0 },
                        },
                        {
                            key: 'lastName',
                            label: 'Apellido',
                            type: 'text',
                            validators: { required: true, maxLength: 100, minLength: 0 },
                        },
                        {
                            key: 'companyName',
                            label: 'Nombre de la Empresa o Asociación',
                            type: 'text',
                            validators: { maxLength: 100, minLength: 0 },
                        },
                        {
                            key: 'phone',
                            label: 'Telefono',
                            type: 'number',
                            validators: { required: true },

                        },
                        

                    ]
                },
                {
                    fields: [

                        
                        {
                            key: 'roleName',
                            label: 'role',
                            type: 'select',
                            options: catalogs['roles'],
                            validators: { required: true },
                        },
                        {
                            key: 'email',
                            label: 'Correo Electrónico',
                            type: 'email',

                            validators: { required: true },

                        },
                        {
                            key: 'password',
                            label: 'Contraseña',
                            type: 'password',

                            validators: { required: true },

                        },

                    ]
                },


            ]
        },


    ]
    )
}