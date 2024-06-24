import { Store } from "react-notifications-component";

//interface ApiErrorProps {}

const ApiError = () => {
  const errorTitle = [
    "2024 and you still crashing shi",
    "No spam plz",
    "Here refreshing the page when you stink? You go refresh ur scent.",
    "Long day",
    "Ion sort out error handling so good luck",
    "Error: 404, no swag found LOOOOOOOOOOOOOOL",
  ];
  const errorMessages = [
    "Your music taste so bad we getting errors? Crazy",
    "Im prolly outside doing reps and you inside refreshing my web page looooooool",
    "And you still can't do a muscle up? LOOOOOOOOOL",
    "Ion even gonna bother sort whatever those playlists were",
    "Pfffff your taste is wack, but feel free to try again",
    "You aint even deserve an error message LOOOOOOOOOL, should've just left that bih loading forever with a fake progress indicator",
    "Ahhhhh this has only ever happened to you, try again tho",
    "If you see this message, sumn aint right. Minor tho, we bounce back as per",
    "If it errors again, it's defo you and ur wack playlists fault. Go do sumn reps instead bum",
    "Error: If you listen to taylor swift, this aint gonna work",
    "This aint my fault btw, the spotify server is getting spammed off, this ur fault",
    "Token expired or sum shi, idk lol, just login again and shush",
  ];
  Store.addNotification({
    title: errorTitle[Math.floor(Math.random() * errorTitle.length)],
    message: errorMessages[Math.floor(Math.random() * errorMessages.length)],
    type: "danger",
    insert: "top",
    container: "top-right",
    animationIn: ["animate__animated", "animate__fadeIn"],
    animationOut: ["animate__animated", "animate__fadeOut"],
    dismiss: {
      duration: 5500,
      onScreen: true,
    },
  });
};

export default ApiError;
