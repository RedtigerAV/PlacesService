import React, { Component } from 'react';
import { Map, TileLayer, Marker, Popup } from 'react-leaflet';
import { Card, Button, CardTitle, CardText, Form, FormGroup, Label, Input } from 'reactstrap';
import L from 'leaflet';
import './App.css';
import messageLocationUrl from './message_location.svg';
import userLocationUrl from './user_location.svg';

var myIcon = L.icon({
    iconUrl: userLocationUrl,
    iconSize: [30, 50]
});

var messageIcon = L.icon({
    iconUrl: messageLocationUrl,
    iconSize: [30, 50],
    iconAnchor: [12.5, 41],
    popupAnchor: [0, -30]
});

const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000/api/v1/messages' : 'production-url';

class App extends Component {
    state = {
        location: {
            lat: 51.505,
            lng: -0.09,
        },
        haveUsersLocation: false,
        zoom: 2,
        userMessage: {
            name: '',
            message: ''
        },
        showMessageForm: false,
        sendingMessage: false,
        sentMessage: false,
        messages: []
    };

    componentDidMount() {
        fetch(API_URL)
            .then(res => res.json())
            .then(messages => {
                this.setState({
                    messages
                })
            });
        navigator.geolocation.getCurrentPosition((position) => {
            this.setState({
                location: {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                },
                haveUsersLocation: true,
                zoom: 13
            })
        }, () => {
            fetch('https://ipapi.co/json')
                .then(res => res.json())
                .then(location => {
                    console.log('Упс... Кажется вы запретили доступ к геоданным. Из-за этого расположене может быть не точным');
                    this.setState({
                        location: {
                            lat: location.latitude,
                            lng: location.longitude
                        },
                        haveUsersLocation: true,
                        zoom: 13
                    })
                })
        })
    }

    formIsValid = () => {
        let { name, message } = this.state.userMessage;
        name = name.trim();
        message = message.trim();

        const validMessage =
            name.length > 0 && name.length <= 500 &&
            message.length > 0 && message.length <= 500;

        return validMessage && this.state.haveUsersLocation ? true : false;
    };

    formSubmitted = (event) => {
        event.preventDefault();

        if (this.formIsValid()) {
            this.setState({
                sendingMessage: true
            });

            const message = {
                name: this.state.userMessage.name,
                message: this.state.userMessage.message,
                latitude: this.state.location.lat,
                longitude: this.state.location.lng,
            };

            fetch(API_URL, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    ...message
                })
            })
                .then(res => res.json())
                .then(message => {
                    console.log(message);
                    setTimeout(() => {
                        this.setState({
                            sendingMessage: false,
                            sentMessage: true
                        });
                    }, 4000);
                });
        }
    };

    valueChanged = (event) => {
        const {name, value} = event.target;
        this.setState((prevState) => ({
            userMessage: {
                ...prevState.userMessage,
                [name]: value
            }
        }))
    };

    render() {
        const position = [this.state.location.lat, this.state.location.lng]
        return (
            <div className="map">
                <Map className="map" center={position} zoom={this.state.zoom}>
                    <TileLayer
                        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {
                        this.state.haveUsersLocation ?
                            <Marker
                                position={position}
                                icon={myIcon}>
                            </Marker> : ''
                    }
                    {
                        this.state.messages.map(message => (
                            <Marker
                                key={message._id}
                                position={[message.latitude, message.longitude]}
                                icon={messageIcon}>
                                <Popup>
                                    <b><em>{message.name}:</em></b> {message.message}
                                </Popup>
                            </Marker>
                        ))
                    }
                </Map>
                <Card body className="message-form">
                    <CardTitle>Welcome to Place Service!</CardTitle>
                    <CardText>Leave a message with your location</CardText>
                    {
                        !this.state.sendingMessage && !this.state.sentMessage && this.state.haveUsersLocation ?
                        <Form onSubmit={this.formSubmitted}>
                            <FormGroup>
                                <Label for="name">Name</Label>
                                <Input type="text"
                                       onChange={this.valueChanged}
                                       name="name"
                                       id="name"
                                       placeholder="Enter your name" />
                            </FormGroup>
                            <FormGroup>
                                <Label for="message">Message</Label>
                                <Input type="textarea"
                                       onChange={this.valueChanged}
                                       name="message"
                                       id="message"
                                       placeholder="Enter a message" />
                            </FormGroup>
                            <Button type="submit"
                                    color="info"
                                    disabled={!this.formIsValid()}
                            >Send message</Button>
                        </Form> :
                            this.state.sendingMessage || !this.state.haveUsersLocation ?
                            <video
                                autoPlay
                                loop
                                src="https://i.giphy.com/media/BCIRKxED2Y2JO/giphy.mp4"></video> :
                            <CardText>Thanks for submitting a message :)</CardText>
                    }
                </Card>
            </div>
        );
    }
}

export default App;
