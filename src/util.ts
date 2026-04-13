import { get as fetchUrl } from 'https'
import { createWriteStream } from 'fs'

export const downloadFile = async (url: string, fileName: string) => {
    await new Promise((resolve, reject) => {
        fetchUrl(url, res => res.pipe(
            createWriteStream(fileName).on('finish', () => resolve('Finished downlaod'))
            .on('error', (err) => reject(err))
        ))
    })
}