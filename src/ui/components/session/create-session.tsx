import { handleCSVFileUpload } from "@/app-layer/shared/utils";
import { BareSession } from "@/domain/session";
import DataImport from "@/ui/components/data-output/import";
import { useCallback, useRef } from "react";
import Header from "../header/main";
import { useModal } from "@/ui/design-system/Modal/context";
import NameSession from "./modals/name-session";

const CreateSession = ({
  isProcessing,
  setIsProcessing,
  handleSessionCreate,
}: {
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  handleSessionCreate: ({ rows, columns }: BareSession) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { openModal, closeModal } = useModal();

  const createSession = useCallback(
    ({ file }: { file: File }) => {
      openModal(
        <>
          <NameSession
            onSubmit={async ({ name }) => {
              // close the modal
              closeModal();

              // create the session
              await handleCSVFileUpload(file, {
                onData: (rows, headers) => {
                  handleSessionCreate({ rows, columns: headers, name });
                },
                onProcessingChange: setIsProcessing,
                onError: (err) => {
                  alert(`${JSON.stringify(err)}`);
                },
              });
            }}
          />
        </>
      );
    },
    [closeModal, handleSessionCreate, openModal, setIsProcessing]
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      createSession({ file });
      e.target.value = "";
    },
    [createSession]
  );

  return (
    <div className="h-[calc(100vh_-_50px)] flex gap-y-4 flex-col justify-center items-center">
      <Header />
      <DataImport
        fileInputRef={fileInputRef}
        onFileChange={handleFileUpload}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default CreateSession;
