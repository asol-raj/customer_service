export default {
    test: {
        name: { label: 'Test', type: 'text ' }
    },
    user: {
        username: { label: 'Username', type: 'text' },
        email: { label: 'Email Address', type: 'email', },
        password: { label: 'Passwrod', type: 'text', },
        full_name: { label: 'Full Name', type: 'text', },
        gender: {
            label: 'Gender', type: 'select', options: [
                { id: '', value: '' },
                { id: 'male', value: 'Male' },
                { id: 'female', value: 'Female' },
                { id: 'other', value: 'Other' },
            ]
        },
        role_id: {
            label: 'User Role', type: 'select', default: '4', options: [
                { id: '2', value: 'Admin' },
                { id: '3', value: 'Manager' },
                { id: '4', value: 'User' },
            ]
        },
        user_type: {
            label: 'User Type', type: 'select', options: [
                { id: 'internal', value: 'Internal' },
                { id: 'external', value: 'Client' }
            ]
        },
        client_id: { label: 'Client', type: 'select', options: [{ id: 1, value: 'CFC' }] },
        is_active: { type: 'hidden', default: 1 },
        address: { type: 'hidden' },
        city: { type: 'hidden' },
        designation: { type: 'hidden' },
        phone: { type: 'hidden' },
        state: { type: 'hidden' },
        zipcode: { type: 'hidden' },
    },
    client: {
        client_name: { label: 'Client Name', type: 'text', required: true },
        short_name: { label: 'Short Name', type: 'text', }
    },

    userdetails: {
        first_name: { label: 'Firts Name', type: 'text' },
        middle_name: { label: 'Middle Name', type: 'text' },
        last_name: { label: 'Last Name', type: 'text' },
        address: { label: 'Address', type: 'textarea' },
        city: { label: 'City', type: 'text' },
        zipcode: { label: 'Zipcode', type: 'text' },
        state: { label: 'State Name', type: 'text' },
        user_id: { type: 'hidden' }
    }
}