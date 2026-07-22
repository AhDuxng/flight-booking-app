import { Mic, Paperclip, Send, X } from "lucide-react";

export default function ChatComposer({
  attachment,
  inputValue,
  isTyping,
  onAttachmentChange,
  onAttachmentRemove,
  onInputChange,
  onSubmit,
  onVoiceInput,
}) {
  const isSubmitDisabled = (!inputValue.trim() && !attachment) || isTyping;

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <footer className="border-t border-outline-variant bg-surface/95 px-4 pb-20 pt-3 backdrop-blur md:px-container-padding md:pb-4 md:pt-4">
      <div className="mx-auto max-w-4xl">
        {attachment ? (
          <div className="mb-2 flex w-fit max-w-full items-center gap-2 rounded-lg bg-primary-fixed px-3 py-2 text-body-sm text-on-primary-fixed-variant">
            <Paperclip className="h-4 w-4 shrink-0" />
            <span className="truncate">{attachment.name}</span>
            <button aria-label="Xóa tệp đính kèm" onClick={onAttachmentRemove} type="button">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}
        <form className="flex items-end gap-2 md:gap-3" onSubmit={handleSubmit}>
          <div className="flex min-w-0 flex-1 items-end rounded-lg border border-outline-variant bg-surface-container-lowest px-2 shadow-sm transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
            <textarea
              aria-label="Câu hỏi cho VietFly AI"
              className="max-h-28 min-h-12 min-w-0 flex-1 resize-none border-0 bg-transparent px-3 py-3 text-body-md text-on-surface outline-none placeholder:text-outline"
              onChange={(event) => onInputChange(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi của bạn..."
              rows={1}
              value={inputValue}
            />
            <label className="mb-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary" title="Đính kèm tệp">
              <Paperclip className="h-5 w-5" />
              <span className="sr-only">Đính kèm tệp</span>
              <input accept=".txt,.md,.csv,.json,text/plain,text/markdown,text/csv,application/json" className="sr-only" onChange={onAttachmentChange} type="file" />
            </label>
            <button
              aria-label="Nhập bằng giọng nói"
              className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
              onClick={onVoiceInput}
              type="button"
            >
              <Mic className="h-5 w-5" />
            </button>
          </div>
          <button
            aria-label="Gửi tin nhắn"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary shadow-md transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-45"
            disabled={isSubmitDisabled}
            type="submit"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
        <p className="mt-2 text-center text-[11px] text-on-surface-variant">
          VietFly AI có thể đưa ra câu trả lời chưa chính xác. Vui lòng kiểm tra lại thông tin quan trọng.
        </p>
      </div>
    </footer>
  );
}
