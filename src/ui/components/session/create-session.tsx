import { handleCSVFileUpload } from '@/app-layer/shared/utils';
import { BareSession } from '@/domain/session';
import DataImport from '@/ui/components/data-output/import'
import { useCallback, useRef } from 'react';
import Header from '../header/main';

const CreateSession = ({
  isProcessing,
  setIsProcessing,
  handleSessionCreate
}: {
  isProcessing: boolean,
  setIsProcessing: (isProcessing: boolean) => void;
  handleSessionCreate: ({ rows, columns }: BareSession) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await handleCSVFileUpload(file, {
      onData: (rows, headers) => {
        handleSessionCreate({ rows, columns: headers });
      },
      onProcessingChange: setIsProcessing,
      onError: (err) => {
        alert(`${JSON.stringify(err)}`)
      }
    });

    e.target.value = '';
  }, [setIsProcessing, handleSessionCreate]);

  return (
    <div className='h-[calc(100vh_-_50px)] flex gap-y-4 flex-col justify-center items-center'>
      <Header />
      <DataImport
        fileInputRef={fileInputRef}
        onFileChange={handleFileUpload}
        isProcessing={isProcessing}
      />
    </div>
  )
}

export default CreateSession