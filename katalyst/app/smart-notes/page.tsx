'use client';

import FileUploadGreen from '../components/smart-notes/FileUploadGreen';
import NotesDisplay from '../components/smart-notes/NotesDisplay';
import PageTemplate from '../components/PageTemplate';
import { SmartNotesProvider, useSmartNotes } from '../contexts/SmartNotesContext';
import ScanningAnimation from '../components/ScanningAnimation';

function SmartNotesContent() {
  const { sources, notes, isProcessing, addSource, removeSource, setNotes, setIsProcessing } = useSmartNotes();

  const handleFilesSelected = async (files: File[]) => {
    if (sources.length > 0) {
      return; // Don't add more files if we already have one
    }
    
    const file = files[0]; // Only take the first file
    const source = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    };
    addSource(source);

    // Process the file
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:5002/process/notes', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process file');
      }

      const data = await response.json();
      console.log('Raw backend response:', data);

      let datas = data.response;
      // Clean the string if needed
      if (datas && typeof datas === 'string') {
        datas = datas.trim().slice(7, -3);
      }

      console.log('Cleaned response:', datas);

      let parsedData;
      try {
        parsedData = JSON.parse(datas);
        console.log('Parsed data:', parsedData);

        // Ensure the object has the correct structure
        const formattedContent = {
          Overview: parsedData.Overview || '',
          "Key Concepts": Array.isArray(parsedData["Key Concepts"]) ? parsedData["Key Concepts"] : [],
          "Critical Points": Array.isArray(parsedData["Critical Points"]) ? parsedData["Critical Points"] : [],
          "Application": Array.isArray(parsedData.Application) ? parsedData.Application : [],
          "Additional Insights": Array.isArray(parsedData["Additional Insights"]) ? parsedData["Additional Insights"] : []
        };

        console.log('Formatted content:', formattedContent);
        setNotes(JSON.stringify(formattedContent));
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        // If parsing fails, create a basic structure with the response as Overview
        const fallbackContent = {
          Overview: datas || 'Invalid response format',
          "Key Concepts": [],
          "Critical Points": [],
          "Application": [],
          "Additional Insights": []
        };
        setNotes(JSON.stringify(fallbackContent));
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setNotes(JSON.stringify({
        Overview: 'Error processing file. Please try again.',
        "Key Concepts": [],
        "Critical Points": [],
        "Application": [],
        "Additional Insights": []
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="pt-20 lg:pt-[6.3rem] px-4 md:px-8 text-sm md:text-base lg:text-lg" style={{ fontFamily: 'var(--font-courier-prime)' }}>
      <div className="grid grid-cols-1 lg:grid-cols-[288px_1fr] gap-6 max-w-[1400px] mx-auto">
        {/* Left Section - Sources */}
        <div className="bg-[#E4FFE1]">
          <div className="border-2 border-black lg:h-[calc(90vh-80px)] h-auto">
            <div className="p-4 ">
              <h1 className="text-base sm:text-lg font-bold mb-4">Sources</h1>
              <FileUploadGreen
                onFilesSelected={handleFilesSelected}
                onFileRemove={removeSource}
                files={sources}
                buttonText={sources.length === 0 ? "Add source" : "Source added"}
                acceptedFileTypes={['.pdf']}
                disabled={sources.length > 0}
              />
            </div>
          </div>
        </div>

        {/* Right Section - Smart Notes */}
        <div className="">
          <div className="border-2 border-black h-[calc(90vh-80px)] bg-white">
            <div className="p-6 h-full flex flex-col bg-[#E4FFE1]">
              <h1 className="text-base sm:text-lg font-bold mb-4">Smart Notes</h1>
              <div className="flex-1 overflow-y-auto">
                {isProcessing ? (
                  <div className="flex items-center justify-center h-full">
                    <ScanningAnimation />
                  </div>
                ) : notes ? (
                  <div className="bg-white rounded-lg h-full">
                    <NotesDisplay content={notes} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm sm:text-base text-gray-500">
                    Upload a file to generate smart notes
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SmartNotesPage() {
  return (
    <PageTemplate>
      <SmartNotesProvider>
        <SmartNotesContent />
      </SmartNotesProvider>
    </PageTemplate>
  );
}
