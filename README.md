# VibeifyV2 
Mapping out your Spotify tracks into 3-dimensional domain, creating a visualisation of the spread of the vibes in your playlists. Using dimension reduction to reduce the large audio features of each track into x,y and z coordinates and plotting them using three.JS.

![image](https://user-images.githubusercontent.com/76885270/230965118-bbc7cb8e-41d8-4c2a-9e99-0a2fee1187a8.png)

# Technologies Used
### Frontend
1. Next.js
2. Sass



https://github.com/ssutl/vibeify_v2/assets/76885270/ff1e98ab-7ae0-4a65-8674-26e7005b3bbe


### API
1. Whisper-I OpenAI model
2. GPT-3.5 OpenAI model

# Features Implemented
1. Transcribing videos
2. Summarising transcription
3. Local storage of current transcriptions

# How it works
Fetch requeests are used in order to download the video from the provided video URL, and these videos are saved locally. These files are then passed into OpenAI's whisper-1 model, which then transcribes the video. Then finally we use GPT-3.5 turbo in order to summarise the transcript. Depending on the the amount of inputs we will loop this process for each link.


# How to run application<br/>
### Setup
1. Create an `.env.local` file in the root directory
2. Add NEXT_PUBLIC_OPENAPI_KEY={Your OPENAI secret key} to the `.env.local` - This key can be generated through the OpenAI's developer accounts

![image](https://user-images.githubusercontent.com/76885270/230969083-899859e9-b4b1-4007-93db-db632aa9a1b6.png)

### Frontend
1. `Run NPM I` (to install needed dependencies)
2. `npm run dev`
