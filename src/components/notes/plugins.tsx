import { useState } from "react";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";

import { ContentEditable } from "@/components/ui/editor/editor-ui/content-editable";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import {
  CHECK_LIST,
  ELEMENT_TRANSFORMERS,
  MULTILINE_ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
} from "@lexical/markdown";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { ToolbarPlugin } from "@/components/ui/editor/plugins/toolbar/toolbar-plugin";
import { BlockFormatDropDown } from "@/components/ui/editor/plugins/toolbar/block-format-toolbar-plugin";
import { FormatParagraph } from "@/components/ui/editor/plugins/toolbar/block-format/format-paragraph";
import { FormatHeading } from "@/components/ui/editor/plugins/toolbar/block-format/format-heading";
import { FormatNumberedList } from "@/components/ui/editor/plugins/toolbar/block-format/format-numbered-list";
import { FormatBulletedList } from "@/components/ui/editor/plugins/toolbar/block-format/format-bulleted-list";
import { FormatCheckList } from "@/components/ui/editor/plugins/toolbar/block-format/format-check-list";
import { FormatQuote } from "@/components/ui/editor/plugins/toolbar/block-format/format-quote";

import { HistoryToolbarPlugin } from "@/components/ui/editor/plugins/toolbar/history-toolbar-plugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ElementFormatToolbarPlugin } from "@/components/ui/editor/plugins/toolbar/element-format-toolbar-plugin";

export function Plugins() {
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  return (
    <div className="relative">
      {/* toolbar plugins */}
      <ToolbarPlugin>
        {({ blockType }) => (
          <div className="vertical-align-middle sticky top-0 z-10 flex gap-2 overflow-auto border-b p-1">
            <HistoryToolbarPlugin />
            <BlockFormatDropDown>
              <FormatParagraph />
              <FormatHeading levels={["h1", "h2", "h3"]} />
              <FormatNumberedList />
              <FormatBulletedList />
              <FormatCheckList />
              <FormatQuote />
            </BlockFormatDropDown>
            <ElementFormatToolbarPlugin />
          </div>
        )}
      </ToolbarPlugin>
      <div className="relative">
        <RichTextPlugin
          contentEditable={
            <div className="">
              <div className="" ref={onRef}>
                <ContentEditable placeholder={"Start typing ..."} />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        {/* editor plugins */}
        <TablePlugin />

        <HorizontalRulePlugin />
        <CheckListPlugin />
        <ListPlugin />
        <MarkdownShortcutPlugin
          transformers={[
            CHECK_LIST,
            ...ELEMENT_TRANSFORMERS,
            ...MULTILINE_ELEMENT_TRANSFORMERS,
            ...TEXT_FORMAT_TRANSFORMERS,
            ...TEXT_MATCH_TRANSFORMERS,
          ]}
        />
        <HistoryPlugin />
      </div>
      {/* actions plugins */}
    </div>
  );
}
