import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getNoteWithSummaryAndTags } from '@/lib/notes/queries'
import { NoteEditor } from '@/components/notes/note-editor'
import { AIStatusSection } from '@/components/notes/ai-status-section'
import { RegenerateAIWrapper } from '@/components/notes/regenerate-ai-wrapper'
import { EditableContent } from '@/components/notes/editable-content'
import { BackButton } from '@/components/ui/back-button'

export default async function NoteDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const supabase = await createClient()
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/signin')
    }

    const { id } = await params
    const result = await getNoteWithSummaryAndTags(id)
    if (!result) {
        notFound()
    }

    const { note, summary, tags } = result

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* 뒤로가기 버튼 */}
            <div className="mb-6">
                <BackButton />
            </div>
            
            {/* AI 상태 섹션 */}
            <AIStatusSection 
                noteId={note.id}
                initialSummary={summary?.content}
                initialTags={tags}
                className="mb-6"
            />
            
            {/* AI 재생성 섹션 */}
            <RegenerateAIWrapper 
                noteId={note.id}
                showLimitInfo={true}
                className="mb-6"
            />
            
            {/* 편집 가능한 콘텐츠 섹션 */}
            <EditableContent
                noteId={note.id}
                initialSummary={summary?.content}
                initialTags={tags}
                className="mb-6"
            />
            
            {/* 노트 에디터 */}
            <NoteEditor note={note} className="mt-8" />
        </div>
    )
}

export const metadata = {
    title: '노트 상세 - AI 메모장',
    description: '노트 상세 보기'
}
