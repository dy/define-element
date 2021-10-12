// forked, stripped, patched @github/template-parts

const ELEMENT = 1, TEXT = 3

export default class TemplateInstance extends DocumentFragment {
    #parts
    #processor
    constructor(template, params, processor = propertyIdentityBooleanCallback) {
        super();
        // This is to fix an inconsistency in Safari which prevents us from
        // correctly sub-classing DocumentFragment.
        // https://bugs.webkit.org/show_bug.cgi?id=195556
        if (Object.getPrototypeOf(this !== TemplateInstance.prototype)) Object.setPrototypeOf(this, TemplateInstance.prototype);
        this.appendChild(template.content.cloneNode(true));
        this.#parts = Array.from(collectParts(this));
        (this.#processor = processor).createCallback?.(this, this.#parts, params);
    }
    update(params) {
        this.#processor.processCallback(this, this.#parts, params);
    }
}
function* collectParts(el) {
    const walker = el.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null, false);
    let node;
    while ((node = walker.nextNode())) {
        if (node.nodeType === ELEMENT && node.hasAttributes()) {
            for (let i = 0; i < node.attributes.length; i += 1) {
                const attr = node.attributes.item(i);
                if (attr && attr.value.includes('{{')) {
                    const valueSetter = new AttributeValueSetter(node, attr);
                    for (const token of parse(attr.value)) {
                        if (token.type === 'string') {
                            valueSetter.append(token.value);
                        }
                        else {
                            const part = new AttributeTemplatePart(valueSetter, token.value);
                            valueSetter.append(part);
                            yield part;
                        }
                    }
                }
            }
        }
        else if (node.nodeType === TEXT && node.textContent && node.textContent.includes('{{')) {
            for (const token of parse(node.textContent)) {
                if (token.end < node.textContent.length)
                    node.splitText(token.end);
                if (token.type === 'part')
                    yield new NodeTemplatePart(node, token.value);
                break;
            }
        }
    }
}
function* parse(text) {
    let value = '';
    let tokenStart = 0;
    let open = false;
    for (let i = 0; i < text.length; i += 1) {
        if (text[i] === '{' && text[i + 1] === '{' && text[i - 1] !== '\\' && !open) {
            open = true;
            if (value)
                yield { type: 'string', start: tokenStart, end: i, value };
            value = '{{';
            tokenStart = i;
            i += 2;
        }
        else if (text[i] === '}' && text[i + 1] === '}' && text[i - 1] !== '\\' && open) {
            open = false;
            yield { type: 'part', start: tokenStart, end: i + 2, value: value.slice(2).trim() };
            value = '';
            i += 2;
            tokenStart = i;
        }
        value += text[i] || '';
    }
    if (value)
        yield { type: 'string', start: tokenStart, end: text.length, value };
}


export class NodeTemplatePart {
    #parts
    constructor(node, expression) {
        this.expression = expression;
        this.#parts = [node];
        node.textContent = '';
    }
    get value() {
        return this.#parts.map(node => node.textContent).join('');
    }
    set value(string) {
        this.replace(string);
    }
    get previousSibling() {
        return this.#parts[0].previousSibling;
    }
    get nextSibling() {
        return this.#parts[this.#parts.length - 1].nextSibling;
    }
    replace(...nodes) {
        // FIXME: possibly simple diffing like spect could come handy here
        const parts = nodes.map(node => typeof node === 'string' ? new Text(node) : node);
        if (!parts.length) parts.push(new Text(''));
        this.#parts[0].before(...parts);
        for (const part of this.#parts) part.remove();
        this.#parts = parts
    }
}

export class AttributeTemplatePart {
    #setter
    #value
    constructor(setter, expression) {
        this.expression = expression;
        this.#setter = setter;
        this.#setter.updateParent('');
    }
    get attributeName() {
        return this.#setter.attr.name;
    }
    get attributeNamespace() {
        return this.#setter.attr.namespaceURI;
    }
    get value() {
        return this.#value;
    }
    set value(value) {
        this.#value = value || '';
        this.#setter.updateParent(value);
    }
    get element() {
        return this.#setter.element;
    }
    get booleanValue() {
        return this.#setter.booleanValue;
    }
    set booleanValue(value) {
        this.#setter.booleanValue = value;
    }
}
export class AttributeValueSetter {
    constructor(element, attr) {
        this.element = element;
        this.attr = attr;
        this.partList = [];
    }
    get booleanValue() {
        return this.element.hasAttributeNS(this.attr.namespaceURI, this.attr.name);
    }
    set booleanValue(value) {
        if (this.partList.length !== 1) {
            throw new DOMException('Operation not supported', 'NotSupportedError');
        }
        ;
        this.partList[0].value = value ? '' : null;
    }
    append(part) {
        this.partList.push(part);
    }
    updateParent(partValue) {
        if (this.partList.length === 1 && partValue === null) {
            this.element.removeAttributeNS(this.attr.namespaceURI, this.attr.name);
        }
        else {
            const str = this.partList.map(s => (typeof s === 'string' ? s : s.value)).join('');
            this.element.setAttributeNS(this.attr.namespaceURI, this.attr.name, str);
        }
    }
}



// processors
export function createProcessor(processPart) {
    return {
        createCallback(instance, parts, params) { this.processCallback(instance, parts, params); },
        processCallback(_, parts, params) {
            var _a;
            for (const part of parts) {
                if (part.expression in params) {
                    const value = (_a = params[part.expression]) !== null && _a !== undefined ? _a : '';
                    processPart(part, value);
                }
            }
        }
    };
}
export const propertyIdentity = createProcessor((part,value) => part.value = String(value));
export const propertyIdentityOrBooleanAttribute = createProcessor((part, value) => {
    processBooleanAttribute(part, value) || processPropertyIdentity(part, value);
});
export const propertyIdentityBooleanCallback = createProcessor((part, value) => {
    processCallback(part, value) || processBooleanAttribute(part, value) || processPropertyIdentity(part, value)
});


export function processPropertyIdentity(part, value) {
    part.value = String(value);
}
export function processBooleanAttribute(part, value) {
    if (typeof value === 'boolean' &&
        part instanceof AttributeTemplatePart &&
        typeof part.element[part.attributeName] === 'boolean' // FIXME: not sure about 100% correctness of this condition
    )
    {
        part.booleanValue = value; // FIXME: this looks overly implicit and complicated. I'd propose doing update logic here
        return true;
    }
    return false;
}
export function processCallback(part, value) {
    if (typeof value !== 'function') return false
    console.log(part, value)
    part.element[part.attributeName] = value
    return true
}
