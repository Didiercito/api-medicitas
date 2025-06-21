import { S3Client } from '@aws-sdk/client-s3';
import { 
  ListBucketsCommand, 
  ListObjectsV2Command, 
  PutObjectCommand, 
  GetObjectCommand,
  DeleteObjectCommand 
} from '@aws-sdk/client-s3';
import { config } from 'dotenv';

config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN!
  }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const TEST_FILE_KEY = 'test-connection.txt';
const TEST_FILE_CONTENT = 'Hola desde TypeScript! Conexión exitosa a S3.';

function checkEnvironmentVariables(): boolean {
  const requiredVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY', 
    'AWS_SESSION_TOKEN',
    'S3_BUCKET_NAME'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Variables de entorno faltantes:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    return false;
  }
  
  console.log('✅ Todas las variables de entorno están configuradas');
  return true;
}

async function testListBuckets(): Promise<boolean> {
  try {
    console.log('\n🧪 Test 1: Listando buckets...');
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    
    console.log('✅ Buckets encontrados:');
    response.Buckets?.forEach(bucket => {
      console.log(`   - ${bucket.Name} (${bucket.CreationDate})`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error listando buckets:', error);
    return false;
  }
}

async function testBucketAccess(): Promise<boolean> {
  try {
    console.log(`\n🧪 Test 2: Verificando acceso al bucket "${BUCKET_NAME}"...`);
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: 5
    });
    
    const response = await s3Client.send(command);
    console.log('✅ Acceso al bucket exitoso');
    console.log(`   - Objetos encontrados: ${response.KeyCount || 0}`);
    
    if (response.Contents && response.Contents.length > 0) {
      console.log('   - Primeros archivos:');
      response.Contents.slice(0, 3).forEach(obj => {
        console.log(`     * ${obj.Key} (${obj.Size} bytes)`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error accediendo al bucket:', error);
    return false;
  }
}

async function testUploadFile(): Promise<boolean> {
  try {
    console.log(`\n🧪 Test 3: Subiendo archivo de prueba "${TEST_FILE_KEY}"...`);
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: TEST_FILE_KEY,
      Body: TEST_FILE_CONTENT,
      ContentType: 'text/plain'
    });
    
    await s3Client.send(command);
    console.log('✅ Archivo subido exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error subiendo archivo:', error);
    return false;
  }
}

async function testDownloadFile(): Promise<boolean> {
  try {
    console.log(`\n🧪 Test 4: Descargando archivo "${TEST_FILE_KEY}"...`);
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: TEST_FILE_KEY
    });
    
    const response = await s3Client.send(command);
    const content = await response.Body?.transformToString();
    
    if (content === TEST_FILE_CONTENT) {
      console.log('✅ Archivo descargado y verificado correctamente');
      console.log(`   - Contenido: "${content}"`);
      return true;
    } else {
      console.error('❌ El contenido del archivo no coincide');
      return false;
    }
  } catch (error) {
    console.error('❌ Error descargando archivo:', error);
    return false;
  }
}

async function testDeleteFile(): Promise<boolean> {
  try {
    console.log(`\n🧪 Test 5: Eliminando archivo de prueba "${TEST_FILE_KEY}"...`);
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: TEST_FILE_KEY
    });
    
    await s3Client.send(command);
    console.log('✅ Archivo eliminado exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error eliminando archivo:', error);
    return false;
  }
}

async function runAllTests(): Promise<void> {
  console.log('🚀 Iniciando pruebas de conexión a S3...');
  console.log('=====================================');
  
  if (!checkEnvironmentVariables()) {
    process.exit(1);
  }
  
  let passedTests = 0;
  const totalTests = 5;
  
  const tests = [
    testListBuckets,
    testBucketAccess, 
    testUploadFile,
    testDownloadFile,
    testDeleteFile
  ];
  
  for (const test of tests) {
    const result = await test();
    if (result) passedTests++;
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 RESUMEN DE PRUEBAS');
  console.log('=====================');
  console.log(`✅ Pruebas exitosas: ${passedTests}/${totalTests}`);
  console.log(`❌ Pruebas fallidas: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ¡Todas las pruebas pasaron! Tu conexión a S3 está funcionando perfectamente.');
  } else {
    console.log('⚠️  Algunas pruebas fallaron. Revisa tu configuración.');
  }
}

if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 Error ejecutando las pruebas:', error);
    process.exit(1);
  });
}