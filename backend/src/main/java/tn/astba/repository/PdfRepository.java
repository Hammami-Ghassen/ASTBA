package tn.astba.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.astba.domain.PdfDocument;

@Repository
public interface PdfRepository extends MongoRepository<PdfDocument, String> {
}
