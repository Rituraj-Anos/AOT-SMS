package com.aot.sms.util;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import java.io.IOException;
import java.io.Writer;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.List;

/**
 * Standard CSV report exporter utility using Apache Commons CSV.
 * Designed to support attendance rosters, marks sheets, and backlog reports.
 */
public class CSVExporter {

    /**
     * Export a JDBC ResultSet to CSV.
     */
    public static void exportResultSet(ResultSet rs, Writer writer) throws SQLException, IOException {
        ResultSetMetaData metaData = rs.getMetaData();
        int columnCount = metaData.getColumnCount();
        String[] headers = new String[columnCount];
        for (int i = 1; i <= columnCount; i++) {
            headers[i - 1] = metaData.getColumnLabel(i);
        }

        CSVFormat csvFormat = CSVFormat.DEFAULT.builder()
                .setHeader(headers)
                .build();

        try (CSVPrinter printer = new CSVPrinter(writer, csvFormat)) {
            while (rs.next()) {
                Object[] row = new Object[columnCount];
                for (int i = 1; i <= columnCount; i++) {
                    row[i - 1] = rs.getObject(i);
                }
                printer.printRecord(row);
            }
            printer.flush();
        }
    }

    /**
     * Export a list of lists of strings/objects to CSV with specific headers.
     */
    public static void exportRecords(List<String> headers, List<List<Object>> records, Writer writer) throws IOException {
        CSVFormat csvFormat = CSVFormat.DEFAULT.builder()
                .setHeader(headers.toArray(new String[0]))
                .build();

        try (CSVPrinter printer = new CSVPrinter(writer, csvFormat)) {
            for (List<Object> record : records) {
                printer.printRecord(record);
            }
            printer.flush();
        }
    }
}
