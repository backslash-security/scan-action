import { spawn } from 'child_process'

/**
 * Downloads a file from S3 using the AWS CLI, which automatically picks up
 * the EC2 instance-role credentials on self-hosted runners.
 * Converts path-style HTTPS URLs (https://s3.amazonaws.com/bucket/key)
 * to s3://bucket/key URIs.
 */
export const downloadFile = async (url: string, fileName: string) => {
    const s3Uri = url.replace(/^https:\/\/s3\.amazonaws\.com\//, 's3://')

    await new Promise<void>((resolve, reject) => {
        const child = spawn('aws', ['s3', 'cp', s3Uri, fileName], {
            stdio: ['inherit', 'pipe', 'pipe'],
        })

        child.stdout?.on('data', (d) => process.stdout.write(d))
        child.stderr?.on('data', (d) => process.stderr.write(d))

        child.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`aws s3 cp failed with exit code ${code} for ${s3Uri}`))
            } else {
                resolve()
            }
        })

        child.on('error', reject)
    })
}