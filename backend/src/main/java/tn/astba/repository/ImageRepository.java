package tn.astba.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.astba.domain.ImageDocument;

@Repository
public interface ImageRepository extends MongoRepository<ImageDocument, String> {
}
