import Foundation
import PDFKit
import Vision
import AppKit

struct Page: Decodable { let pdf: Data; let page: Int; let edge: CGFloat }
struct Line: Encodable { let t: String; let x, y, w, h: CGFloat; let confidence: Float }
func run(_ item: Page) throws -> [Line] {
    guard let page = PDFDocument(data: item.pdf)?.page(at: item.page - 1) else { throw CocoaError(.fileReadUnknown) }
    let size = page.bounds(for: .cropBox).size
    let scale = item.edge / max(size.width, size.height)
    let image = page.thumbnail(of: CGSize(width: size.width * scale,height: size.height * scale), for: .cropBox)
    var bounds = CGRect(origin: .zero,size: image.size)
    guard let cg = image.cgImage(forProposedRect: &bounds, context: nil,hints: nil) else { throw CocoaError(.fileReadUnknown) }
    let req = VNRecognizeTextRequest()
    req.recognitionLevel = .accurate; req.usesLanguageCorrection = true
    let langs = try req.supportedRecognitionLanguages()
    req.recognitionLanguages = ["pl-PL","en-US"].filter(langs.contains)
    try VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
    return (req.results ?? []).compactMap { observation in
        guard let line = observation.topCandidates(1).first else { return nil }
        let box = observation.boundingBox
        return Line(t: line.string, x: box.minX, y: 1 - box.maxY, w: box.width, h: box.height, confidence: line.confidence)
    }
}
do {
    let item = try JSONDecoder().decode(Page.self, from: FileHandle.standardInput.readDataToEndOfFile())
    let lines = try run(item)
    FileHandle.standardOutput.write(try JSONEncoder().encode(lines))
} catch { exit(1) }
