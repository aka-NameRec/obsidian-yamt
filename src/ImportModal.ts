import { App, Modal, Setting } from 'obsidian';
import type { ImportOptions } from './converters';
import type YamtPlugin from './main';

export const DEFAULT_IMPORT_OPTIONS: ImportOptions = {
  withHeader: false,
  importAlignment: true,
  promoteStylesToHeader: true,
};

export class ImportModal extends Modal {
  private readonly opts: ImportOptions;
  private readonly onConfirm: (opts: ImportOptions) => void;

  constructor(
    app: App,
    plugin: YamtPlugin,
    onConfirm: (opts: ImportOptions) => void,
  ) {
    super(app);
    this.opts = { ...plugin.settings };
    this.onConfirm = onConfirm;
  }

  override onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: 'Import table from clipboard' });

    new Setting(contentEl)
      .setName('First row is header')
      .setDesc('Treat the first row as a header section')
      .addToggle(toggle => {
        toggle
          .setValue(this.opts.withHeader)
          .onChange(val => {
            this.opts.withHeader = val;
          });
      });

    new Setting(contentEl)
      .setName('Import alignment')
      .setDesc('Automatically align numbers to the right')
      .addToggle(toggle => {
        toggle
          .setValue(this.opts.importAlignment)
          .onChange(val => {
            this.opts.importAlignment = val;
          });
      });

    new Setting(contentEl)
      .setName('Promote repeated styles to header')
      .setDesc(
        'If all data cells in a column share the same alignment, ' +
        'move it into the header cell instead of repeating it in every data cell',
      )
      .addToggle(toggle => {
        toggle
          .setValue(this.opts.promoteStylesToHeader)
          .onChange(val => {
            this.opts.promoteStylesToHeader = val;
          });
      });

    new Setting(contentEl)
      .addButton(btn => {
        btn
          .setButtonText('Import')
          .setCta()
          .onClick(() => {
            this.onConfirm(this.opts);
            this.close();
          });
      })
      .addButton(btn => {
        btn
          .setButtonText('Cancel')
          .onClick(() => {
            this.close();
          });
      });
  }

  override onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
