import {
	DeleteObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const env = (key: string) => {
	const value = process.env[key];
	if (!value) throw new Error(`Variável de ambiente ausente: ${key}`);
	return value;
};

let client: S3Client | null = null;
const s3 = () => {
	client ??= new S3Client({
		endpoint: env("S3_ENDPOINT"),
		region: env("S3_REGION"),
		forcePathStyle: true,
		credentials: {
			accessKeyId: env("S3_ACCESS_KEY"),
			secretAccessKey: env("S3_SECRET_KEY"),
		},
	});
	return client;
};

export const publicUrl = (key: string) => `${env("S3_PUBLIC_URL")}/${key}`;

export async function presignUpload(
	key: string,
	contentType: string,
	size: number,
) {
	return getSignedUrl(
		s3(),
		new PutObjectCommand({
			Bucket: env("S3_BUCKET"),
			Key: key,
			ContentType: contentType,
			ContentLength: size,
		}),
		{ expiresIn: 60 * 5 },
	);
}

export async function deleteObject(key: string) {
	await s3().send(
		new DeleteObjectCommand({ Bucket: env("S3_BUCKET"), Key: key }),
	);
}
