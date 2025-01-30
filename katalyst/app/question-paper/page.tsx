'use client';

import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { usePdfStore } from '../store/pdfStore';
import PDFViewer from '../components/PDFViewer';
import { Plus, X, Loader2 } from "lucide-react";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';

export default function QuestionPaper() {
  // const [isNavbarBlurred, setIsNavbarBlurred] = React.useState(false);
  const router = useRouter();
  const { 
    pdfUrl, 
    pdfSources, 
    setPdfUrl, 
    addPdfSource, 
    removePdfSource,
    isGenerating,
    generatedPdf,
    setIsGenerating,
    setGeneratedPdf,
    reset: originalReset 
  } = usePdfStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showQuestionPaper, setShowQuestionPaper] = useState(false);
  const [navItems, setNavItems] = useState<{ label: string; href: string }[]>([
    { label: 'Home', href: '/' },
    { label: 'Question Paper', href: '/question-paper' },
    { label: 'Flashcards', href: '/flashcards' },
    { label: 'Quiz', href: '/quiz' },
    { label: 'Smart Notes', href: '/smart-notes' },
    { label: 'AI Assistant', href: '/ai-assistant' },
    { label: 'Revise', href: '/revise' },
  ]);
  const [minimalNavMode, setMinimalNavMode] = useState(false);
  const [showCustomNavbar, setShowCustomNavbar] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    // setIsNavbarBlurred(true);
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      // Limit to 1 PDF source
      if (pdfSources.length === 0) {
        const url = URL.createObjectURL(file);
        addPdfSource(url);
        if (!pdfUrl) {
          setPdfUrl(url);
        }
      } else {
        alert('Only one PDF source is allowed.');
      }
    } else {
      alert('Please upload a PDF file');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!pdfUrl) return;

    setIsGenerating(true);
    try {
      const formData = new FormData();
      // Convert URL to File object
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const file = new File([blob], 'document.pdf', { type: 'application/pdf' });
      formData.append('file', file);

      const serverResponse = await fetch('http://localhost:5002/generate', {
        method: 'POST',
        body: formData,
      });

      if (!serverResponse.ok) {
        throw new Error(`HTTP error! status: ${serverResponse.status}`);
      }

      const data = await serverResponse.json();
      let datas = data.final_output;
      let parsedData: any;

      console.log('Raw response:', datas);
      
      if (datas && typeof datas === 'string') {
        // Remove the markdown code block markers
        datas = datas.trim().slice(7, -3);
        console.log('Cleaned data:', datas);
      }

      try {
        parsedData = JSON.parse(datas);
        console.log('Successfully parsed JSON:', parsedData);
      } catch (parseError) {
        console.error('JSON Parsing Error:', parseError);
        throw new Error('Failed to parse the server response.');
      }

      // Validate the parsed data structure
      if (parsedData && 
          typeof parsedData === 'object' &&
          'title' in parsedData &&
          'sections' in parsedData &&
          Array.isArray(parsedData.sections) && 
          parsedData.sections.length > 0) {
        console.log('Valid question paper format:', parsedData);
        setGeneratedPdf(parsedData);
        setShowCustomNavbar(true);
      } else {
        console.error('Invalid question paper format:', {
          hasData: !!parsedData,
          isObject: typeof parsedData === 'object',
          hasTitle: parsedData && 'title' in parsedData,
          hasSections: parsedData && 'sections' in parsedData,
          isSectionsArray: parsedData && 'sections' in parsedData && Array.isArray(parsedData.sections),
          sectionsLength: parsedData?.sections?.length
        });
        throw new Error('Invalid question paper format');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate question paper. Please try again.');
    } finally {
      setIsGenerating(false);
      // setIsNavbarBlurred(false);
    }
  };

  const handleStartAnswering = () => {
    router.push('/exam-mode');
  };

  const reset = () => {
    // Reset to default navigation
    setNavItems([
      { label: 'Home', href: '/' },
      { label: 'Question Paper', href: '/question-paper' },
      { label: 'Quiz', href: '/quiz' },
      { label: 'Smart Notes', href: '/smart-notes' },
      { label: 'AI Assistant', href: '/ai-assistant' },
      { label: 'Revise', href: '/revise' },
    ]);
    
    // Reset to full navigation mode
    setMinimalNavMode(false);
    
    // Clear PDF sources
    setPdfSources([]);
    setPdfUrl(null);
    
    // Call the original reset from usePdfStore
    originalReset();
    setShowCustomNavbar(false);
    setGeneratedPdf(null);
  };

  // Custom minimal navbar for question paper
  const CustomNavbar = () => (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b-2 border-t-2 border-black">
      <div className="flex justify-between items-center">
        <Link href="/" className="border-r-2 border-black px-6 py-4">
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-courier-prime)' }}>
            EduSage
          </h1>
        </Link>
        <div className="flex flex-wrap">
          <Link 
            href="/answers"
            className="px-6 py-4 border-x-2 border-black border-l-2 hover:bg-[#FFB800] transition-colors"
            style={{ fontFamily: 'var(--font-courier-prime)' }}
          >
            Show Answers
          </Link>
          <Link 
            href="/exam-mode"
            className="px-6 py-4 border-r-2 border-black hover:bg-[#FFB800] transition-colors"
            style={{ fontFamily: 'var(--font-courier-prime)' }}
          >
            Try it Yourself
          </Link>
        </div>
      </div>
    </nav>
  );

  return (
    <>
      {/* Conditionally render either the default Navbar or the custom two-link Navbar */}
      {generatedPdf ? <CustomNavbar /> : <Navbar customNavItems={navItems} minimalMode={minimalNavMode} />}
      
      <div className="min-h-screen bg-white">
        <main className="pt-20 lg:pt-[6.3rem] px-4 md:px-8 text-sm md:text-base lg:text-lg" style={{ fontFamily: 'var(--font-courier-prime)' }}>
          <div className="max-w-[1400px] mx-auto ">
            <div className={generatedPdf ? "" : "grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 "}>
              {/* Sources Section - Hide when showing generated paper */}
              {!generatedPdf && (
                <div className="border-2 border-black bg-[#CCF1EE] p-4">
                  <h2 className="text-base sm:text-lg font-bold mb-4">Sources</h2>
                  <div className="space-y-3">
                    {pdfSources.map((source, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 border-2 border-black cursor-pointer hover:bg-gray-50"
                        onClick={() => setPdfUrl(source)}
                      >
                        <span>PDF Source {index + 1}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removePdfSource(source);
                            if (pdfUrl === source) {
                              setPdfUrl(pdfSources[0] || null);
                            }
                          }}
                          className="hover:text-red-500"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={pdfSources.length > 0}
                    className={`mt-4 w-full flex items-center justify-center gap-2 py-2 px-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-medium ${pdfSources.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Plus size={18} />
                    Add Source
                  </button>
                </div>
              )}

              {/* Main Content Section */}
              <div className="border-2 border-black bg-[#CCF1EE]">
                {generatedPdf ? (
                  <div className="flex-1 bg-white p-6 overflow-auto">
                    <div className="prose max-w-none">
                      <h1 className="text-2xl font-bold text-center mb-6">{generatedPdf.title}</h1>
                      <div className="mb-8">
                        <h2 className="text-lg font-semibold mb-2">Instructions:</h2>
                        <ul className="list-disc pl-5">
                          {generatedPdf.instructions.map((instruction: string, index: number) => (
                            <li key={index} className="text-gray-700">{instruction}</li>
                          ))}
                        </ul>
                      </div>
                      {generatedPdf.sections.map((section: any, sectionIndex: number) => (
                        <div key={sectionIndex} className="mb-8">
                          <div className="flex justify-between items-center mb-4 ">
                            <h2 className="text-xl font-semibold">{section.section_title}</h2>
                            <span className="text-gray-600">Total Marks: {section.total_marks}</span>
                          </div>
                          <div className="space-y-6">
                            {section.questions.map((question: any, questionIndex: number) => (
                              <div key={questionIndex} className="border-2 border-black p-4 rounded">
                                <div className="flex">
                                  <div className="mr-4 font-medium min-w-[2rem]">
                                    {question.question_number}.
                                  </div>
                                  <div className="flex-grow">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-grow">
                                        <p className="text-gray-800 whitespace-pre-wrap">{question.question_text}</p>
                                        {question.options && (
                                          <div className="mt-4 space-y-2">
                                            {Object.entries(question.options).map(([key, value]) => (
                                              <div key={key} className="flex items-start">
                                                <span className="mr-2 font-medium">{key}.</span>
                                                <span>{value as string}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <span className="text-gray-500 ml-4 whitespace-nowrap">[{question.marks} marks]</span>
                                    </div>
                                    {section.background && questionIndex === 0 && (
                                      <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                                        <h3 className="font-medium mb-2">Case Study Background:</h3>
                                        <p className="text-gray-700">{section.background}</p>
                                        {section.problem_statement && (
                                          <div className="mt-4">
                                            <h4 className="font-medium mb-1">Problem Statement:</h4>
                                            <p className="text-gray-700">{section.problem_statement}</p>
                                          </div>
                                        )}
                                        {section.supporting_data && (
                                          <div className="mt-4">
                                            <h4 className="font-medium mb-1">Supporting Data:</h4>
                                            <ul className="list-disc pl-5 space-y-1">
                                              {section.supporting_data.map((data: string, index: number) => (
                                                <li key={index} className="text-gray-600">{data}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                <button
                  onClick={reset}
                  className="w-full py-2.5 px-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-medium"
                >
                  Generate Another Question Paper
                </button>
              </div>
                  </div>
                ) : (
                  <>
                    {pdfUrl ? (
                      <>
                        <PDFViewer pdfUrl={pdfUrl} />
                        <div className="p-4 border-t-2 border-black">
                          <button 
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              'Generate Question Paper'
                            )}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-[590px]">
                        <p className="lg:text-lg md:text-lg ">Please upload a PDF file first</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Reset Button - Only show when question paper is generated */}
            {/* {generatedPdf && (
              <div className="mt-4">
                <button
                  onClick={reset}
                  className="w-full py-2.5 px-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-medium"
                >
                  Generate Another Question Paper
                </button>
              </div>
            )} */}
          </div>
        </main>
      </div>
    </>
  );
}
