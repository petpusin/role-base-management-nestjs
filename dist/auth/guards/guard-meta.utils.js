"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMetadata = getMetadata;
function getMetadata(reflector, metadataKey, context) {
    return reflector.getAllAndOverride(metadataKey, [
        context.getHandler(),
        context.getClass(),
    ]);
}
//# sourceMappingURL=guard-meta.utils.js.map