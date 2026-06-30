import { min } from "rxjs"


export const registerFormFields = (catalogs: any) => {

    return ([

        {
            type: 'column',
            columns: [
                {
                    fields: [

                        {
                            key: 'firstName',
                            label: 'REGISTER.FIRST_NAME',
                            type: 'text',
                            validators: { required: true, maxLength: 50, minLength: 0 },
                        },
                        {
                            key: 'lastName',
                            label: 'REGISTER.LAST_NAME',
                            type: 'text',
                            validators: { required: true, maxLength: 100, minLength: 0 },
                        },
                        {
                            key: 'companyName',
                            label: 'REGISTER.COMPANY_NAME',
                            type: 'text',
                            validators: { maxLength: 100, minLength: 0 },
                        },
                        {
                            // Teléfono como TEXTO (no number): admite +, espacios y
                            // ceros a la izquierda, y evita el desbordamiento numérico.
                            // El pattern muestra "Formato inválido" si trae letras.
                            key: 'phone',
                            label: 'REGISTER.PHONE',
                            type: 'text',
                            validators: { required: true, minLength: 7, maxLength: 20, pattern: '^[0-9+()\\s-]{7,20}$' },

                        },
                       /*  {
                            key: 'roleName',
                            label: 'role',
                            type: 'select',
                            options: catalogs['roles'],
                            validators: { required: true },
                        }, */
                        {
                            key: 'email',
                            label: 'REGISTER.EMAIL',
                            type: 'email',

                            validators: { required: true },

                        },
                        {
                            key: 'password',
                            label: 'REGISTER.PASSWORD',
                            type: 'password',

                            validators: { required: true,   maxLength: 30 ,minLength:6},

                        },

                    ]
                },


            ]
        },


    ]
    )
}