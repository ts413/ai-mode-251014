import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getNoteWithSummary } from '@/lib/notes/queries'
import { NoteEditor } from '@/components/notes/note-editor'
import { NoteSummary } from '@/components/notes/note-summary'

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
    const result = await getNoteWithSummary(id)
    if (!result) {
        notFound()
    }

    const { note, summary } = result

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* AI 요약 섹션 */}
            <NoteSummary summary={summary} />
            
            {/* 노트 에디터 */}
            <NoteEditor note={note} />
        </div>
    )
}

export const metadata = {
    title: '노트 상세 - AI 메모장',
    description: '노트 상세 보기'
}
