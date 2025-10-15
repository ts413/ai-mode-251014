import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getNoteWithSummaryAndTags } from '@/lib/notes/queries'
import { NoteEditor } from '@/components/notes/note-editor'
import { NoteSummary } from '@/components/notes/note-summary'
import { NoteTags } from '@/components/notes/note-tags'
import { AIStatusSection } from '@/components/notes/ai-status-section'
import { RegenerateAI } from '@/components/notes/regenerate-ai'
import { EditableContent } from '@/components/notes/editable-content'

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
            {/* AI 상태 섹션 */}
            <AIStatusSection 
                noteId={note.id}
                initialSummary={summary?.content}
                initialTags={tags}
                className="mb-6"
            />
            
            {/* AI 재생성 섹션 */}
            <RegenerateAI 
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
            
            {/* 기존 요약/태그 섹션 (편집 불가) */}
            <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">AI 요약</h3>
                <NoteSummary summary={summary} />
            </div>
            
            <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">AI 태그</h3>
                <NoteTags tags={tags} />
            </div>
            
            {/* 노트 에디터 */}
            <NoteEditor note={note} />
        </div>
    )
}

export const metadata = {
    title: '노트 상세 - AI 메모장',
    description: '노트 상세 보기'
}
