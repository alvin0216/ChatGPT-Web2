
import axios from 'axios';

export function genImg(prompt: string) {
	return axios<{
		ImagePath: string,
		ImageContent: string
	}>({
		url: 'http://localhost:8081/GenImg', method: 'post', data: {
			"server": "10.176.33.52",
			"port": 7860,
			"prompt": prompt,
			"OutputDir": "C:\\GeneratedPictures",
		}
	})
}

export function setWallpaper(imagePath: string) {
	return axios({
		url: 'http://localhost:8081/SetWallpaper', method: 'post', data: {
			imagePath
		}
	})
}
