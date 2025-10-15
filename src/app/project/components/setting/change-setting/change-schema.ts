import { read } from "fs"


export const changeFormFields = (catalogs: any) => {

    return ([

        {
            type: 'column',
            columns: [
                {
                    fields: [

                        {
                            key: 'currentPassword',
                            label: 'contraseña actual ',
                            type: 'password',
                            validators: { required: true },
                        },
                        {
                            key: 'newPassword',
                            label: 'Nueva contraseña',
                            type: 'password',
                            validators: { required: true},
                        },
                       
                        

                    ]
                }


            ]
        },


    ]
    )
}