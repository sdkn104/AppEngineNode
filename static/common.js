


export function fetch_json(url, message) {
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText} for request ${message.command}`);
        }
        return response.json();
    })
    .then(data => {
        if( data.error ) {
            throw data.error;
        }    
        //console.log(data)
        return data;
    });
}
